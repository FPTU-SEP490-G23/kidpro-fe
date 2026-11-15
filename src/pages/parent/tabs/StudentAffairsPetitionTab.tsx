import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Bus,
  BookOpen,
  HelpCircle,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  Calendar,
  MessageSquare,
  ChevronRight,
  Loader2,
  Plus,
  X,
  FileCheck2,
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import {
  PetitionCategory,
  PetitionDeliveryFormat,
  StudentPetitionItem,
  CreatePetitionPayload,
} from '../../../types/parent.types';
import { formatDate } from '../../../utils/formatters';

interface StudentAffairsPetitionTabProps {
  studentId: string;
  studentName: string;
  className?: string;
}

const CATEGORIES: {
  key: PetitionCategory;
  title: string;
  description: string;
  slaText: string;
  icon: React.ElementType;
  badge: string;
  color: string;
}[] = [
  {
    key: 'STUDENT_CONFIRMATION',
    title: 'Cấp Giấy Xác Nhận Học Sinh',
    description: 'Làm thủ tục xin visa du lịch, bảo hiểm y tế, hoàn tất hồ sơ cơ quan cha mẹ',
    slaText: 'Cam kết 24 - 48 giờ làm việc',
    icon: FileText,
    badge: 'Hồ sơ pháp lý',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 text-[#275A4E]',
  },
  {
    key: 'BUS_ROUTE_CHANGE',
    title: 'Thay Đổi Tuyến Xe Buýt Đưa Đón',
    description: 'Chuyển đổi điểm đón/trả bé, cập nhật tuyến xe khi gia đình thay đổi nơi cư trú',
    slaText: 'Cam kết 24 giờ làm việc',
    icon: Bus,
    badge: 'Đưa đón an toàn',
    color: 'from-amber-500/10 to-yellow-500/10 border-amber-200 text-amber-800',
  },
  {
    key: 'ACADEMIC_RECORD_COPY',
    title: 'Trích Lục Học Bạ / Sổ Theo Dõi',
    description: 'Bản sao công chứng sổ theo dõi sức khỏe, bảng đánh giá thể chất và quá trình học',
    slaText: 'Cam kết 48 giờ làm việc',
    icon: BookOpen,
    badge: 'Học bạ mầm non',
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-200 text-blue-800',
  },
  {
    key: 'FEE_INQUIRY_OTHER',
    title: 'Thắc Mắc Chi Phí & Thủ Tục Khác',
    description: 'Đề nghị rà soát học phí, dịch vụ ngoại khóa hoặc các thắc mắc hành chính sự vụ',
    slaText: 'Cam kết 24 giờ làm việc',
    icon: HelpCircle,
    badge: 'Giải đáp học vụ',
    color: 'from-purple-500/10 to-violet-500/10 border-purple-200 text-purple-800',
  },
];

export const StudentAffairsPetitionTab: React.FC<StudentAffairsPetitionTabProps> = ({
  studentId,
  studentName,
  className = 'Mầm 1 (3-4 Tuổi)',
}) => {
  const queryClient = useQueryClient();

  // Navigation mode: 'FORM' | 'TRACKING'
  const [viewMode, setViewMode] = useState<'FORM' | 'TRACKING'>('FORM');

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<PetitionCategory>('STUDENT_CONFIRMATION');
  const [description, setDescription] = useState('');
  const [deliveryFormat, setDeliveryFormat] = useState<PetitionDeliveryFormat>('DIGITAL_PDF');
  
  // Mặc định ngày nhận kết quả là 2 ngày sau (đảm bảo SLA >= 24h)
  const defaultTargetDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [targetDate, setTargetDate] = useState(defaultTargetDate);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [newChatInput, setNewChatInput] = useState('');

  // Selected petition for detailed timeline & chat
  const [selectedPetitionId, setSelectedPetitionId] = useState<string | null>(null);

  // System Toast Messages
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // 1. Fetch petitions list (GET /api/academic/petitions?studentId=...)
  const { data: petitions = [], isLoading } = useQuery<StudentPetitionItem[]>({
    queryKey: ['student-petitions', studentId],
    queryFn: () => parentApi.getStudentPetitions(studentId),
  });

  // Selected Petition object
  const activePetition =
    petitions.find((p) => p.id === selectedPetitionId) || petitions[0] || null;

  // 2. Mutation Submit Petition (POST /api/academic/petitions)
  const submitPetitionMutation = useMutation({
    mutationFn: (payload: CreatePetitionPayload) => parentApi.submitStudentPetition(payload),
    onSuccess: (newPetition) => {
      queryClient.invalidateQueries({ queryKey: ['student-petitions', studentId] });
      setToastMessage({
        type: 'success',
        text: `Gửi yêu cầu học vụ thành công. Mã theo dõi: ${newPetition.trackingCode}. Dự kiến hoàn tất trong 48 giờ làm việc`,
      });
      setDescription('');
      setAttachments([]);
      setSelectedPetitionId(newPetition.id);
      setViewMode('TRACKING');
    },
    onError: () => {
      setToastMessage({
        type: 'error',
        text: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
      });
    },
  });

  // 3. Mutation Send Chat Message
  const sendMessageMutation = useMutation({
    mutationFn: ({ petitionId, content }: { petitionId: string; content: string }) =>
      parentApi.sendPetitionMessage(petitionId, content),
    onSuccess: (msg) => {
      if (activePetition) {
        activePetition.messages.push(msg);
      }
      setNewChatInput('');
    },
  });

  // Submit Handler with Client-Side Business Rules
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(null);

    const cleanDesc = description.trim();

    // BR-050 & Kiểm tra độ dài nội dung tối thiểu 10 ký tự
    if (cleanDesc.length < 10) {
      setToastMessage({
        type: 'error',
        text: 'Vui lòng mô tả chi tiết nội dung yêu cầu cần nhà trường hỗ trợ (tối thiểu 10 ký tự).',
      });
      return;
    }

    // Chống gửi trùng lặp nếu đang có phiếu cùng danh mục ở trạng thái SUBMITTED hoặc IN_PROGRESS
    const duplicate = petitions.find(
      (p) =>
        p.category === selectedCategory &&
        (p.status === 'SUBMITTED' || p.status === 'IN_PROGRESS')
    );
    if (duplicate) {
      setToastMessage({
        type: 'warning',
        text: 'Bạn đã có một yêu cầu cho dịch vụ này đang được xử lý. Vui lòng không gửi trùng lặp.',
      });
      return;
    }

    // Quy định thời gian xử lý: Khung hẹn ngày trả không được sớm hơn 24 giờ
    const now = new Date();
    const chosenDate = new Date(`${targetDate}T23:59:59`);
    const diffHours = (chosenDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      setToastMessage({
        type: 'warning',
        text: 'Thời gian xử lý văn bản hành chính cần tối thiểu 24-48 giờ làm việc theo quy định.',
      });
      return;
    }

    // Gửi payload hợp lệ
    submitPetitionMutation.mutate({
      studentId,
      category: selectedCategory,
      description: cleanDesc,
      deliveryFormat,
      targetDate,
      attachmentUrls: attachments,
    });
  };

  // Giả lập đính kèm tệp
  const handleSimulateAttachment = () => {
    const fakeFile = `https://kidpro.edu.vn/uploads/giay_to_${Date.now().toString().slice(-4)}.pdf`;
    setAttachments((prev) => [...prev, fakeFile]);
  };

  // Xóa tệp đính kèm
  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Điều Hướng Chế Độ (Form vs Tracking) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#275A4E]/10 px-3 py-1 text-xs font-bold text-[#275A4E] mb-2">
            <FileCheck2 className="h-4 w-4" />
            <span>Phân Hệ Hành Chính Học Vụ </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Nộp Đơn Yêu Cầu Sự Vụ Học Sinh & Theo Dõi Tiến Độ (SLA 24-48h)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Học sinh: <strong>{studentName}</strong> • {className} • Trực tuyến hóa thủ tục hành chính, cấp giấy xác nhận, trích lục hồ sơ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('FORM')}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px] ${
              viewMode === 'FORM'
                ? 'bg-[#275A4E] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Tạo Phiếu Yêu Cầu Mới</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('TRACKING')}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px] ${
              viewMode === 'TRACKING'
                ? 'bg-[#275A4E] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Theo Dõi Tiến Độ ({petitions.length})</span>
          </button>
        </div>
      </div>

      {/* Thông báo Toast Alert */}
      {toastMessage && (
        <div
          className={`rounded-2xl p-4 text-xs font-medium flex items-center justify-between shadow-xs transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border border-amber-300'
              : toastMessage.type === 'info'
              ? 'bg-blue-50 text-blue-900 border border-blue-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
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

      {/* ================= GIAO DIỆN 1: FORM NỘP ĐƠN SỰ VỤ ================= */}
      {viewMode === 'FORM' && (
        <div className="space-y-6">
          {/* Lưới Thẻ Nhóm Thủ Tục Hành Chính (Service Category Selector) */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Bước 1: Chọn Danh Mục Thủ Tục Hành Chính Cần Yêu Cầu</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.key;
                return (
                  <div
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`cursor-pointer rounded-3xl border-2 p-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#275A4E] bg-gradient-to-b from-emerald-50/80 to-white shadow-md ring-2 ring-[#275A4E]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
                            isSelected ? 'bg-[#275A4E] text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-emerald-100 text-[#1E4D40] border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {cat.badge}
                        </span>
                      </div>

                      <h5 className="font-extrabold text-sm text-slate-900 mb-1">{cat.title}</h5>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                      <Clock className="h-3 w-3 text-[#275A4E]" />
                      <span>{cat.slaText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Biểu Mẫu Gửi Đơn Yêu Cầu Học Vụ (Affairs Petition Form) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h4 className="text-base font-extrabold text-slate-900">
                Bước 2: Điền Chi Tiết Nội Dung Yêu Cầu
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Vui lòng cung cấp đầy đủ thông tin để cán bộ giáo vụ hoàn tất văn bản chuẩn xác và đúng hạn.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hàng 1: Chọn con & Danh mục đã chọn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Học sinh cần làm thủ tục
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`Bé: ${studentName} (${className})`}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Thủ tục đang chọn
                  </label>
                  <input
                    type="text"
                    disabled
                    value={CATEGORIES.find((c) => c.key === selectedCategory)?.title}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-[#275A4E]"
                  />
                </div>
              </div>

              {/* Hàng 2: Nội dung mô tả chi tiết yêu cầu (Bắt buộc >= 10 ký tự, BR-050) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Nội dung mô tả chi tiết yêu cầu <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-semibold ${
                      description.trim().length >= 10 ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {description.trim().length} / 10 ký tự tối thiểu
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Kính nhờ Nhà trường cấp 02 bản Giấy xác nhận bé đang theo học Lớp Chồi 1 có đóng dấu đỏ để gia đình hoàn tất hồ sơ visa du lịch."
                  className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#275A4E] focus:outline-hidden focus:ring-1 focus:ring-[#275A4E]"
                />
                <p className="mt-1 text-[11px] text-slate-400 italic">
                  Quy chuẩn quy định: Nội dung cần tối thiểu 10 ký tự mô tả rõ mục đích để nhà trường phê duyệt nhanh chóng.
                </p>
              </div>

              {/* Hàng 3: Hình thức nhận kết quả & Ngày mong muốn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-50/70 border border-slate-200">
                {/* Hình thức nhận */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Hình thức nhận kết quả
                  </label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-white cursor-pointer transition hover:border-[#275A4E]">
                      <input
                        type="radio"
                        name="deliveryFormat"
                        checked={deliveryFormat === 'DIGITAL_PDF'}
                        onChange={() => setDeliveryFormat('DIGITAL_PDF')}
                        className="text-[#275A4E] focus:ring-[#275A4E]"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">
                          Nhận bản điện tử PDF qua Email / Cổng Web
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Tiết kiệm thời gian, nhận nhanh trong 24 giờ
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-white cursor-pointer transition hover:border-[#275A4E]">
                      <input
                        type="radio"
                        name="deliveryFormat"
                        checked={deliveryFormat === 'HARD_COPY_OFFICE'}
                        onChange={() => setDeliveryFormat('HARD_COPY_OFFICE')}
                        className="text-[#275A4E] focus:ring-[#275A4E]"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">
                          Nhận bản giấy có dấu mộc trực tiếp tại Văn phòng
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Quầy tiếp nhận số 1 tầng trệt (Mang CCCD đối chiếu)
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Ngày mong muốn nhận & SLA nhắc nhở */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Thời hạn mong muốn nhận kết quả
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                  />

                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="h-3.5 w-3.5 text-amber-700" />
                      <span>Cam kết thời gian xử lý (SLA):</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Theo quy chế nhà trường, văn bản hành chính cần tối thiểu <strong>24 - 48 giờ làm việc</strong> để Ban Giám Hiệu kiểm tra hồ sơ và ký đóng dấu.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hàng 4: Tệp đính kèm (Giấy tờ liên quan, CCCD, đơn bảo hiểm) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tệp đính kèm bổ sung (Ảnh CCCD, đơn bảo hiểm, chứng từ nếu có)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSimulateAttachment}
                    className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 hover:border-[#275A4E] bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition"
                  >
                    <Paperclip className="h-4 w-4 text-[#275A4E]" />
                    <span>Thêm tệp đính kèm (PDF / Ảnh)</span>
                  </button>

                  {attachments.map((_, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-900 font-semibold"
                    >
                      <Paperclip className="h-3 w-3 text-emerald-600" />
                      <span>Tệp đính kèm {idx + 1}.pdf</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-slate-400 hover:text-rose-600 font-bold"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nút Submit Form */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={submitPetitionMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white px-7 py-3.5 text-xs font-bold shadow-md shadow-[#275A4E]/20 transition disabled:opacity-50 min-h-[48px]"
                >
                  {submitPetitionMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang Xử Lý Gửi Đơn...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>NỘP ĐƠN YÊU CẦU HỌC VỤ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= GIAO DIỆN 2: TAB THEO DÕI TIẾN ĐỘ XỬ LÝ ĐƠN ================= */}
      {viewMode === 'TRACKING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cột trái: Danh sách các phiếu đã gửi (4 cột) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between pb-2">
              <h4 className="text-sm font-bold text-slate-900">
                Danh Sách Phiếu Sự Vụ ({petitions.length})
              </h4>
              <button
                type="button"
                onClick={() => setViewMode('FORM')}
                className="text-xs font-bold text-[#275A4E] hover:underline flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Gửi phiếu mới</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#275A4E]" />
                Đang tải danh sách phiếu yêu cầu...
              </div>
            ) : petitions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 p-6">
                Chưa có phiếu sự vụ nào được gửi.
              </div>
            ) : (
              <div className="space-y-3">
                {petitions.map((pet) => {
                  const isSelected = activePetition?.id === pet.id;
                  return (
                    <div
                      key={pet.id}
                      onClick={() => setSelectedPetitionId(pet.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        isSelected
                          ? 'border-[#275A4E] bg-emerald-50/40 shadow-xs ring-1 ring-[#275A4E]'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs text-slate-800">
                          {pet.trackingCode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pet.status === 'SUBMITTED'
                              ? 'bg-blue-100 text-blue-800'
                              : pet.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-800'
                              : pet.status === 'APPROVED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {pet.status === 'SUBMITTED' && 'ĐÃ NỘP ĐƠN'}
                          {pet.status === 'IN_PROGRESS' && 'ĐANG XỬ LÝ'}
                          {pet.status === 'APPROVED' && 'ĐÃ KÝ DUYỆT'}
                          {pet.status === 'READY_FOR_PICKUP' && 'SẴN SÀNG BÀN GIAO'}
                        </span>
                      </div>

                      <h5 className="font-bold text-xs text-slate-900 line-clamp-1">
                        {pet.categoryTitle}
                      </h5>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {pet.description}
                      </p>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Gửi lúc: {formatDate(pet.createdAt)}</span>
                        <span className="flex items-center gap-1 font-semibold text-slate-600">
                          <span>Chi tiết</span>
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cột phải: Chi tiết tiến trình Status Stepper & Tin nhắn trao đổi (7 cột) */}
          <div className="lg:col-span-7 space-y-5">
            {!activePetition ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
                Chọn một phiếu yêu cầu để xem chi tiết tiến độ xử lý.
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
                {/* Header chi tiết phiếu */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-[#275A4E]">
                        {activePetition.trackingCode}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600 font-semibold">
                        {activePetition.categoryTitle}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phụ trách: <strong>{activePetition.assignedStaffName || 'Phòng Giáo vụ'}</strong>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Hạn bàn giao:</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center sm:justify-end gap-1">
                      <Calendar className="h-3.5 w-3.5 text-[#275A4E]" />
                      <span>{formatDate(activePetition.targetDate)}</span>
                    </span>
                  </div>
                </div>

                {/* THANH TIẾN TRÌNH TRẠNG THÁI TRỰC QUAN (STATUS STEPPER) */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-700">Tiến trình giải quyết thủ tục:</h5>
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {[
                      { step: 1, label: 'Đã nộp đơn', key: 'SUBMITTED' },
                      { step: 2, label: 'Đang xử lý', key: 'IN_PROGRESS' },
                      { step: 3, label: 'BGH ký duyệt', key: 'APPROVED' },
                      { step: 4, label: 'Bàn giao', key: 'READY_FOR_PICKUP' },
                    ].map((stepItem, idx) => {
                      const statusOrder = ['SUBMITTED', 'IN_PROGRESS', 'APPROVED', 'READY_FOR_PICKUP'];
                      const currentIdx = statusOrder.indexOf(activePetition.status);
                      const isCompleted = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;

                      return (
                        <div key={stepItem.key} className="text-center space-y-1.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${
                              isCompleted ? 'bg-[#275A4E]' : 'bg-slate-200'
                            } ${isCurrent ? 'ring-2 ring-[#78C2AD]' : ''}`}
                          />
                          <p
                            className={`text-[11px] font-bold ${
                              isCompleted ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {stepItem.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Nội dung yêu cầu */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="text-slate-500 font-bold block">Nội dung yêu cầu từ phụ huynh:</span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    "{activePetition.description}"
                  </p>
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap gap-4">
                    <span>
                      Hình thức nhận: <strong>{activePetition.deliveryFormat === 'DIGITAL_PDF' ? 'Bản điện tử PDF' : 'Bản giấy tại văn phòng'}</strong>
                    </span>
                    {activePetition.resultDocumentUrl && (
                      <a
                        href={activePetition.resultDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#275A4E] font-bold hover:underline"
                      >
                        [Tải file văn bản kết quả PDF]
                      </a>
                    )}
                  </div>
                </div>

                {/* KHUNG TIN NHẮN TRAO ĐỔI BỔ SUNG TRỰC TIẾP GIỮA PHỤ HUYNH VÀ GIÁO VỤ */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-[#275A4E]" />
                    <span>Trao đổi bổ sung thông tin với Cán bộ Giáo vụ</span>
                  </h5>

                  {/* Danh sách tin nhắn */}
                  <div className="space-y-3 max-h-60 overflow-y-auto p-4 rounded-2xl bg-slate-50/70 border border-slate-200">
                    {activePetition.messages.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 italic py-2">
                        Chưa có tin nhắn trao đổi nào cho phiếu này.
                      </p>
                    ) : (
                      activePetition.messages.map((m) => {
                        const isParent = m.sender === 'PARENT';
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isParent ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                              <span className="font-bold text-slate-700">{m.senderName}</span>
                              <span>•</span>
                              <span>{m.sentAt.replace('T', ' ').slice(11, 16)}</span>
                            </div>
                            <div
                              className={`p-3 rounded-2xl text-xs max-w-sm leading-relaxed ${
                                isParent
                                  ? 'bg-[#275A4E] text-white rounded-tr-xs'
                                  : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-tl-xs'
                              }`}
                            >
                              {m.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input gửi tin nhắn */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newChatInput.trim() || !activePetition) return;
                      sendMessageMutation.mutate({
                        petitionId: activePetition.id,
                        content: newChatInput.trim(),
                      });
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={newChatInput}
                      onChange={(e) => setNewChatInput(e.target.value)}
                      placeholder="Nhập nội dung nhắn gửi thêm tới cán bộ giáo vụ..."
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={!newChatInput.trim() || sendMessageMutation.isPending}
                      className="rounded-xl bg-[#275A4E] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#1E4D40] transition disabled:opacity-50 min-h-[40px] flex items-center gap-1"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Gửi</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAffairsPetitionTab;
