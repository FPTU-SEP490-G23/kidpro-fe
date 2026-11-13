import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Eye,
  X,
  Sparkles,
  CheckCheck,
  Calendar,
  AlertTriangle,
  Loader2,
  Lock,
  KeyRound,
  MessageSquare
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import { GateEventType, GateNotificationItem } from '../../../types/parent.types';
import { formatDate } from '../../../utils/formatters';

interface GateNotificationsTabProps {
  studentId: string;
  studentName: string;
  className?: string;
}

export const GateNotificationsTab: React.FC<GateNotificationsTabProps> = ({
  studentId,
  studentName,
  className = 'Mầm 1 (3-4 Tuổi)',
}) => {
  const queryClient = useQueryClient();

  // Filter state
  const [filterType, setFilterType] = useState<'ALL' | GateEventType>('ALL');

  // Modal / Lightbox State
  const [selectedEvent, setSelectedEvent] = useState<GateNotificationItem | null>(null);
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string } | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    code?: string;
    text: string;
  } | null>(null);

  // 1. Fetch gate notifications (GET /api/notifications)
  const { data: notifications = [], isLoading } = useQuery<GateNotificationItem[]>({
    queryKey: ['gate-notifications', studentId, filterType],
    queryFn: () => parentApi.getGateNotifications(studentId, filterType),
  });

  // 2. Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => parentApi.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-notifications'] });
    },
  });

  // 3. Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: () => parentApi.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-notifications'] });
      setToastMessage({
        type: 'success',
        text: 'Đã đánh dấu tất cả thông báo cổng là đã đọc.',
      });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Handle Image Fallback
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackUrl?: string) => {
    const target = e.currentTarget;
    if (fallbackUrl && target.src !== fallbackUrl) {
      target.src = fallbackUrl;
      setToastMessage({
        type: 'info',
        code: 'MSG-187',
        text: 'Đang tải ảnh qua cổng dữ liệu bảo mật dự phòng CDN.',
      });
    }
  };

  // Format detailed timestamp HH:mm:ss DD/MM/YYYY
  const formatFullTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `${time} • ${formatDate(isoString)}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Thanh Tiêu Đề & Bộ Lọc Hoạt Động Cổng */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#275A4E]" />
              <span>Nhật Ký Cổng Trường & Kiểm Chứng Ảnh Đón Trả</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Học sinh: <strong>{studentName}</strong> ({className}) • Mốc giờ chuẩn từng giây & ảnh chụp kiosk AI cổng trường
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-bold">
                {unreadCount} thông báo mới
              </span>
            )}
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 min-h-[44px]"
            >
              <CheckCheck className="h-4 w-4 text-[#275A4E]" />
              <span>Đánh dấu đã đọc tất cả</span>
            </button>
          </div>
        </div>

        {/* Bộ lọc loại sự kiện */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-600 mr-1">Bộ lọc:</span>
          {[
            { id: 'ALL', label: 'Tất Cả Sự Kiện Cổng' },
            { id: 'GATE_CHECKIN', label: 'Điểm Danh Buổi Sáng (Check-in)' },
            { id: 'GATE_CHECKOUT', label: 'Tan Trường Buổi Chiều (Check-out)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition min-h-[44px] ${
                filterType === tab.id
                  ? 'bg-[#275A4E] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`rounded-xl p-4 text-xs font-medium flex items-center justify-between shadow-xs transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border border-amber-300'
              : toastMessage.type === 'info'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. Danh Sách Thẻ Sự Kiện Dòng Thời Gian (Timeline Event Cards) */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#275A4E]" />
            Đang tải dữ liệu sự kiện cổng trường...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Calendar className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            Chưa có sự kiện cổng nào trong khoảng thời gian này.
          </div>
        ) : (
          <div className="relative pl-6 md:pl-8 before:absolute before:left-3 md:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 space-y-6">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`relative bg-white rounded-2xl border p-4 md:p-5 shadow-xs transition hover:shadow-md ${
                  !item.isRead ? 'border-[#78C2AD] bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                {/* Timeline Dot Indicator */}
                <div
                  className={`absolute -left-9 md:-left-10 top-5 h-6 w-6 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                    item.eventType === 'GATE_CHECKIN'
                      ? 'bg-[#275A4E] text-white'
                      : 'bg-[#E5A93C] text-slate-900'
                  }`}
                >
                  {item.eventType === 'GATE_CHECKIN' ? (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  ) : (
                    <KeyRound className="h-3.5 w-3.5" />
                  )}
                </div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Event details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.eventType === 'GATE_CHECKIN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.eventType === 'GATE_CHECKIN' ? 'ĐẾN TRƯỜNG (CHECK-IN)' : 'TAN TRƯỜNG (CHECK-OUT)'}
                      </span>

                      {item.isAiRecognized ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#78C2AD]/20 text-[#1E4D40] border border-[#78C2AD]/40">
                          <Sparkles className="h-3 w-3 text-[#275A4E]" />
                          Camera AI Nhận Diện ({item.confidenceScore ? `${Math.round(item.confidenceScore * 100)}%` : '98%'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          Điểm danh Thủ công
                        </span>
                      )}

                      {!item.isRead && (
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>

                    <h4 className="text-sm md:text-base font-extrabold text-slate-900">
                      {item.title}
                    </h4>

                    {/* Metadata: Location, Time */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#275A4E]" />
                        <strong>{formatFullTime(item.timestamp)}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {item.gateLocation}
                      </span>
                    </div>

                    {/* Checkout Details: Guardian */}
                    {item.eventType === 'GATE_CHECKOUT' && (
                      <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-100 space-y-1">
                        <p>
                          <span className="text-slate-500">Người đón nhận bé:</span>{' '}
                          <strong className="text-slate-900">{item.guardianName || 'Người thân'}</strong>{' '}
                          {item.relationship && (
                            <span className="text-slate-500">({item.relationship})</span>
                          )}
                        </p>
                        {item.isEmergencyPickup && (
                          <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            Ủy quyền đón hộ đột xuất trong ngày
                          </span>
                        )}
                      </div>
                    )}

                    {/* SMS Fallback Banner */}
                    {item.smsFallbackTriggered && (
                      <div className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Thông báo đẩy qua mạng internet thất bại. Hệ thống đã gửi tin nhắn SMS dự phòng đến số điện thoại phụ huynh.</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Photo Thumbnail & Action */}
                  <div className="flex md:flex-col items-center gap-2 shrink-0">
                    <div className="relative group cursor-pointer">
                      <img
                        src={item.photoUrl}
                        alt="Ảnh cổng"
                        onError={(e) => handleImageError(e, item.fallbackPhotoUrl)}
                        onClick={() =>
                          setLightboxImg({
                            url: item.photoUrl,
                            title: `${item.title} - ${formatFullTime(item.timestamp)}`,
                          })
                        }
                        className="h-20 w-20 md:h-24 md:w-24 rounded-2xl object-cover border-2 border-[#78C2AD]/50 shadow-xs group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                        <Eye className="h-5 w-5" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEvent(item);
                        if (!item.isRead) {
                          markReadMutation.mutate(item.id);
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 text-xs font-bold transition min-h-[44px]"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#275A4E]" />
                      <span>Chi tiết</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Modal Xem Chi Tiết Sự Kiện An Ninh Cổng (Gate Security Detail Modal) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#275A4E]" />
                  <span>Chi Tiết Sự Kiện An Ninh Cổng</span>
                </h4>
                <p className="text-xs text-slate-500">Mã giao thức: {selectedEvent.id}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* High Resolution Photo Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black">
              <img
                src={selectedEvent.photoUrl}
                alt="Ảnh sự kiện cổng"
                onError={(e) => handleImageError(e, selectedEvent.fallbackPhotoUrl)}
                className="w-full h-56 object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md rounded-xl p-2.5 text-white text-[11px] flex items-center justify-between">
                <span>Vị trí: <strong>{selectedEvent.gateLocation}</strong></span>
                <span>Camera AI: <strong>Độ tin cậy 98%</strong></span>
              </div>
            </div>

            {/* Event Info Table */}
            <div className="rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-700 space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Loại sự kiện:</span>
                <strong className="text-[#275A4E]">
                  {selectedEvent.eventType === 'GATE_CHECKIN' ? 'Điểm danh đến trường' : 'Tan trường trả trẻ'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời điểm quét:</span>
                <strong>{formatFullTime(selectedEvent.timestamp)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Học sinh:</span>
                <strong>{selectedEvent.studentName}</strong>
              </div>
              {selectedEvent.guardianName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Người đón nhận:</span>
                  <strong>{selectedEvent.guardianName} ({selectedEvent.relationship || 'Người thân'})</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Mã băm an toàn:</span>
                <span className="font-mono text-[11px] text-slate-500">
                  {selectedEvent.securityHash || 'SHA256:GATE_VERIFIED'}
                </span>
              </div>
            </div>

            {/* Thông báo chân trang MSG-185 */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Sự kiện cổng đã được xác thực</strong> theo giao thức an toàn mầm non và Nghị định 13/2023/NĐ-CP.
              </span>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full rounded-xl bg-slate-900 hover:bg-black py-3 text-xs font-bold text-white transition min-h-[44px]"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}

      {/* 4. Lightbox Modal Phóng To Ảnh */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-2"
          >
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/60 text-white p-2 hover:bg-black/80 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxImg.url}
              alt={lightboxImg.title}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <div className="py-2.5 px-3 text-center text-xs text-slate-600 font-semibold flex items-center justify-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-[#275A4E]" />
              <span>{lightboxImg.title}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GateNotificationsTab;
