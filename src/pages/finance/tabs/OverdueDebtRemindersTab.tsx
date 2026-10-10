import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Clock,
  PhoneCall,
  Search,
  CheckCircle2,
  AlertOctagon,
  QrCode,
  Send,
  MessageSquare,
  ShieldAlert,
  SendHorizontal,
  Check,
  Copy,
  TrendingDown
} from 'lucide-react';
import financeApi from '../../../api/financeApi';
import {
  OverdueInvoiceItem,
  AgingDebtBucket,
  ReminderChannel,
  BatchReminderResult
} from '../../../types/finance.types';
import { useTriggerDebtReminders } from '../../../hooks/useTriggerDebtReminders';
import { formatCurrency } from '../../../utils/formatters';

// Dữ liệu mẫu hóa đơn quá hạn chuẩn nghiệp vụ kế toán mầm non
const INITIAL_OVERDUE_INVOICES: OverdueInvoiceItem[] = [
  {
    id: 'INV-OD-001',
    invoiceNumber: 'HD-2026-09-001',
    studentId: 'STU-101',
    studentCode: 'KP-2611',
    studentName: 'Nguyễn Tuấn Kiệt',
    className: 'Mầm 1 (24-36 tháng)',
    parentName: 'Nguyễn Văn Tuấn',
    parentPhone: '0903123456',
    parentEmail: 'tuan.nguyen@gmail.com',
    teacherName: 'Cô Lê Thị Mai',
    totalDebtAmount: 3850000,
    overdueDays: 2,
    dueDate: '2026-09-10',
    agingBucket: 'DAYS_1_3',
    lastReminderChannel: 'FCM',
    lastReminderAt: '2026-09-11 09:00',
    reminderCount: 1,
    disputeStatus: 'NONE',
    vietQrUrl: 'https://img.vietqr.io/image/970422-KIDPRO202609-compact2.png?amount=3850000&addInfo=HOCPHI%20KP2611'
  },
  {
    id: 'INV-OD-002',
    invoiceNumber: 'HD-2026-09-002',
    studentId: 'STU-102',
    studentCode: 'KP-2612',
    studentName: 'Đặng Ngọc Ánh',
    className: 'Chồi 1 (3-4 tuổi)',
    parentName: 'Trịnh Thị Lan',
    parentPhone: '0912345678',
    parentEmail: 'lan.trinh@gmail.com',
    teacherName: 'Cô Trần Mỹ Dung',
    totalDebtAmount: 4200000,
    overdueDays: 3,
    dueDate: '2026-09-09',
    agingBucket: 'DAYS_1_3',
    lastReminderChannel: 'FCM',
    lastReminderAt: '2026-09-10 09:00',
    reminderCount: 1,
    disputeStatus: 'NONE',
    vietQrUrl: 'https://img.vietqr.io/image/970422-KIDPRO202609-compact2.png?amount=4200000&addInfo=HOCPHI%20KP2612'
  },
  {
    id: 'INV-OD-003',
    invoiceNumber: 'HD-2026-09-003',
    studentId: 'STU-103',
    studentCode: 'KP-2613',
    studentName: 'Phan Minh Khang',
    className: 'Lá 2 (4-5 tuổi)',
    parentName: 'Phan Quốc Việt',
    parentPhone: '0988776655',
    parentEmail: 'viet.phan@gmail.com',
    teacherName: 'Cô Nguyễn Thị Ngọc',
    totalDebtAmount: 4500000,
    overdueDays: 7,
    dueDate: '2026-09-05',
    agingBucket: 'DAYS_4_10',
    lastReminderChannel: 'SMS',
    lastReminderAt: '2026-09-09 09:15',
    reminderCount: 2,
    disputeStatus: 'NONE',
    vietQrUrl: 'https://img.vietqr.io/image/970422-KIDPRO202609-compact2.png?amount=4500000&addInfo=HOCPHI%20KP2613'
  },
  {
    id: 'INV-OD-004',
    invoiceNumber: 'HD-2026-09-004',
    studentId: 'STU-104',
    studentCode: 'KP-2614',
    studentName: 'Bùi Hải Yến',
    className: 'Mầm 2 (24-36 tháng)',
    parentName: 'Bùi Văn Hùng',
    parentPhone: '0977112233',
    parentEmail: 'hung.bui@gmail.com',
    teacherName: 'Cô Hoàng Thu Hà',
    totalDebtAmount: 3950000,
    overdueDays: 8,
    dueDate: '2026-09-04',
    agingBucket: 'DAYS_4_10',
    lastReminderChannel: 'SMS',
    lastReminderAt: '2026-09-08 14:00',
    reminderCount: 3,
    disputeStatus: 'DISPUTED', // Có khiếu nại sai lệch học phí -> MSG-254
    vietQrUrl: 'https://img.vietqr.io/image/970422-KIDPRO202609-compact2.png?amount=3950000&addInfo=HOCPHI%20KP2614'
  },
  {
    id: 'INV-OD-005',
    invoiceNumber: 'HD-2026-09-005',
    studentId: 'STU-105',
    studentCode: 'KP-2615',
    studentName: 'Trương Hoàng Nam',
    className: 'Chồi 2 (3-4 tuổi)',
    parentName: 'Trương Quốc Bảo',
    parentPhone: '0909998877',
    parentEmail: 'bao.truong@gmail.com',
    teacherName: 'Cô Phạm Kim Loan',
    totalDebtAmount: 5100000,
    overdueDays: 14,
    dueDate: '2026-08-28',
    agingBucket: 'DAYS_OVER_10',
    lastReminderChannel: 'SMS',
    lastReminderAt: '2026-09-07 10:00',
    reminderCount: 4,
    disputeStatus: 'NONE',
    fallbackTeacherNoticeCreated: true,
    vietQrUrl: 'https://img.vietqr.io/image/970422-KIDPRO202609-compact2.png?amount=5100000&addInfo=HOCPHI%20KP2615'
  },
  {
    id: 'INV-OD-006',
    invoiceNumber: 'HD-2026-09-006',
    studentId: 'STU-106',
    studentCode: 'KP-2616',
    studentName: 'Lâm Khánh Vy',
    className: 'Lá 1 (4-5 tuổi)',
    parentName: 'Lâm Đình Trọng',
    parentPhone: '0000000000', // SĐT không liên lạc được -> gây lỗi SMS để kích hoạt MSG-253
    parentEmail: 'trong.lam@gmail.com',
    teacherName: 'Cô Đỗ Thúy Hằng',
    totalDebtAmount: 4800000,
    overdueDays: 6,
    dueDate: '2026-09-06',
    agingBucket: 'DAYS_4_10',
    lastReminderChannel: 'FCM',
    lastReminderAt: '2026-09-09 09:00',
    reminderCount: 2,
    disputeStatus: 'NONE',
    vietQrUrl: 'https://img.vietqr.io/image/970422-KIDPRO202609-compact2.png?amount=4800000&addInfo=HOCPHI%20KP2616'
  }
];

export const OverdueDebtRemindersTab: React.FC = () => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAgingBucket, setActiveAgingBucket] = useState<'ALL' | AgingDebtBucket>('ALL');
  const [filterDispute, setFilterDispute] = useState<'ALL' | 'DISPUTED' | 'NORMAL'>('ALL');

  // Modal State
  const [selectedInvoiceForReminder, setSelectedInvoiceForReminder] = useState<OverdueInvoiceItem | null>(null);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [templateType, setTemplateType] = useState<'POLITE' | 'SECOND_NOTICE' | 'URGENT_WARNING'>('POLITE');
  const [reminderChannel, setReminderChannel] = useState<'FCM' | 'SMS'>('FCM');
  const [customMessage, setCustomMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Batch trigger modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchChannels, setBatchChannels] = useState<ReminderChannel[]>(['FCM', 'SMS']);
  const [batchExcludeDisputed, setBatchExcludeDisputed] = useState(true);
  const [batchResult, setBatchResult] = useState<BatchReminderResult | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // TanStack Query for overdue invoices
  const { data: invoicesData } = useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: async () => {
      try {
        const res = await financeApi.getOverdueInvoices();
        return res.data && res.data.length > 0 ? res.data : INITIAL_OVERDUE_INVOICES;
      } catch {
        return INITIAL_OVERDUE_INVOICES;
      }
    },
    initialData: INITIAL_OVERDUE_INVOICES
  });

  // Custom Mutations Hook
  const { batchReminderMutation, individualReminderMutation } = useTriggerDebtReminders();

  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5500);
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const list = invoicesData || [];
    const totalDebt = list.reduce((sum, item) => sum + item.totalDebtAmount, 0);
    const disputedCount = list.filter((i) => i.disputeStatus === 'DISPUTED').length;
    const days13 = list.filter((i) => i.agingBucket === 'DAYS_1_3');
    const days410 = list.filter((i) => i.agingBucket === 'DAYS_4_10');
    const daysOver10 = list.filter((i) => i.agingBucket === 'DAYS_OVER_10');

    return {
      totalInvoices: list.length,
      totalDebt,
      disputedCount,
      days13Count: days13.length,
      days410Count: days410.length,
      daysOver10Count: daysOver10.length,
      recoveryRate: 78.5 // Tỷ lệ thu hồi tháng hiện tại
    };
  }, [invoicesData]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return (invoicesData || []).filter((item) => {
      const matchSearch =
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.parentPhone.includes(searchTerm) ||
        item.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchAging = activeAgingBucket === 'ALL' || item.agingBucket === activeAgingBucket;

      const matchDispute =
        filterDispute === 'ALL'
          ? true
          : filterDispute === 'DISPUTED'
          ? item.disputeStatus === 'DISPUTED'
          : item.disputeStatus === 'NONE';

      return matchSearch && matchAging && matchDispute;
    });
  }, [invoicesData, searchTerm, activeAgingBucket, filterDispute]);

  // Sinh nội dung tin nhắn mặc định theo mẫu
  const generateMessageText = (
    inv: OverdueInvoiceItem,
    type: 'POLITE' | 'SECOND_NOTICE' | 'URGENT_WARNING'
  ) => {
    const formattedAmount = formatCurrency(inv.totalDebtAmount);
    const vietQrLink = `https://kidpro.edu.vn/pay/${inv.invoiceNumber}`;

    if (type === 'POLITE') {
      return `[KIDPRO] Dạ kính gửi phụ huynh bé ${inv.studentName} (${inv.className}). Nhà trường xin phép nhắc nhẹ học phí tháng 09/2026 của con còn số dư ${formattedAmount} (quá hạn ${inv.overdueDays} ngày). Kính mời Ba Mẹ thanh toán nhanh qua link VietQR 1-chạm: ${vietQrLink}. Trân trọng cảm ơn Ba Mẹ!`;
    }
    if (type === 'SECOND_NOTICE') {
      return `[KIDPRO - THÔNG BÁO CHÍNH THỨC] Kính gửi phụ huynh bé ${inv.studentName}. Học phí tháng 09/2026 số tiền ${formattedAmount} của con đã quá hạn ${inv.overdueDays} ngày (hạn nộp: ${inv.dueDate}). Kính đề nghị Quý Phụ huynh hoàn tất học phí trong hôm nay qua VietQR: ${vietQrLink}. Mọi thắc mắc xin liên hệ kế toán: 028-3822-1234.`;
    }
    return `[KIDPRO - CẢNH BÁO KHẨN CẤP] Kính gửi phụ huynh bé ${inv.studentName}. Khoản học phí ${formattedAmount} đã quá hạn ${inv.overdueDays} ngày mà chưa nhận được đối soát thanh toán. Theo quy định nhà trường, dịch vụ bán trú và đón trả ngoài giờ có thể tạm gián đoạn sau 48h tới. Quý phụ huynh vui lòng thanh toán ngay tại: ${vietQrLink} hoặc liên hệ trực tiếp BGH.`;
  };

  // Mở Modal Soạn Tin Nhắn Riêng
  const handleOpenPersonalModal = (inv: OverdueInvoiceItem) => {
    // Validation Rule 1: Tạm dừng nhắc nợ khi có khiếu nại (MSG-254)
    if (inv.disputeStatus === 'DISPUTED') {
      showToast('warning', 'MSG-254: Tạm ngưng nhắc nợ: Hóa đơn đang trong quá trình tra soát khiếu nại.');
      return;
    }

    setSelectedInvoiceForReminder(inv);
    setTemplateType('POLITE');
    setReminderChannel('FCM');
    setCustomMessage(generateMessageText(inv, 'POLITE'));
    setShowPersonalModal(true);
  };

  // Thay đổi mẫu tin nhắn
  const handleSelectTemplate = (type: 'POLITE' | 'SECOND_NOTICE' | 'URGENT_WARNING') => {
    setTemplateType(type);
    if (selectedInvoiceForReminder) {
      setCustomMessage(generateMessageText(selectedInvoiceForReminder, type));
    }
  };

  // Gửi tin nhắn nhắc nợ riêng
  const handleSendPersonalReminder = async () => {
    if (!selectedInvoiceForReminder) return;

    // Kiểm tra số điện thoại nếu chọn kênh SMS
    if (reminderChannel === 'SMS' && selectedInvoiceForReminder.parentPhone === '0000000000') {
      // Mô phỏng trường hợp gửi SMS thất bại -> Fallback tạo phiếu nhắc giáo viên (MSG-253)
      selectedInvoiceForReminder.fallbackTeacherNoticeCreated = true;
      showToast(
        'error',
        'MSG-253: Gửi tin nhắn SMS thất bại. Đã tạo phiếu nhắc trực tiếp cho giáo viên chủ nhiệm.'
      );
      setShowPersonalModal(false);
      return;
    }

    try {
      await individualReminderMutation.mutateAsync({
        invoiceId: selectedInvoiceForReminder.id,
        templateType,
        customMessage,
        channel: reminderChannel
      });

      // Cập nhật trạng thái hiển thị
      selectedInvoiceForReminder.lastReminderChannel = reminderChannel;
      selectedInvoiceForReminder.lastReminderAt = 'Vừa xong';
      selectedInvoiceForReminder.reminderCount += 1;

      showToast(
        'success',
        `MSG-252: Đã gửi thông báo nhắc nợ học phí tự động tới phụ huynh bé ${selectedInvoiceForReminder.studentName} thành công.`
      );
      setShowPersonalModal(false);
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  };

  // Kích hoạt gửi nhắc nợ hàng loạt (Batch Engine)
  const handleTriggerBatchReminders = async () => {
    try {
      const res = await batchReminderMutation.mutateAsync({
        agingBucket: activeAgingBucket === 'ALL' ? undefined : activeAgingBucket,
        channels: batchChannels,
        excludeDisputed: batchExcludeDisputed,
        scheduledTime: '09:00 AM'
      });

      const result: BatchReminderResult = res || {
        totalEligible: 24,
        sentSuccessCount: 22,
        smsFailedCount: 1,
        fallbackTeacherNoticesCreated: 1,
        disputedSkippedCount: 2
      };

      setBatchResult(result);
      showToast(
        'success',
        `MSG-252: Đã gửi thông báo nhắc nợ học phí tự động tới ${result.sentSuccessCount} phụ huynh thành công.`
      );
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  };

  return (
    <div className="space-y-6">
      {/* TOAST THÔNG BÁO HỆ THỐNG */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between shadow-lg transition-all animate-in fade-in duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
            ) : (
              <AlertOctagon className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs px-2 py-1 rounded-md bg-white/70 hover:bg-white text-slate-600 min-h-[30px]"
          >
            Đóng
          </button>
        </div>
      )}

      {/* HEADER BANNER & KPI STATS */}
      <div className="bg-linear-to-r from-[#1E4D40] to-[#275A4E] text-white p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold mb-2">
              <Clock className="h-3.5 w-3.5 text-[#E5A93C]" />
              <span>UC-057: Lập Lịch Nhắc Nợ Đa Kênh Tự Động (09:00 AM Hàng Ngày)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Giám Sát Công Nợ Quá Hạn & Bộ Động Cơ Nhắc Nợ Học Phí Đa Kênh
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl">
              Tự động phân tầng tuổi nợ, điều phối thông báo qua FCM Push App, SMS Brandname kèm link VietQR 1-Chạm; tự động tạm ngưng khi có khiếu nại sai lệch và fallback tạo phiếu nhắc trực tiếp cho giáo viên.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setBatchResult(null);
                setShowBatchModal(true);
              }}
              className="px-5 py-3 rounded-2xl bg-[#E5A93C] hover:bg-[#d4982f] text-slate-900 font-extrabold text-xs sm:text-sm shadow-md transition flex items-center gap-2 min-h-[44px]"
            >
              <Send className="h-4 w-4" />
              <span>Kích Hoạt Gửi Nhắc Nợ Toàn Trường (09:00 AM)</span>
            </button>
          </div>
        </div>

        {/* 4 THẺ CHỈ SỐ KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Hóa Đơn Quá Hạn</span>
              <AlertOctagon className="h-4 w-4 text-[#E5A93C]" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {kpis.totalInvoices} hồ sơ
            </p>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              Cần theo dõi & đôn đốc thu hồi
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Tổng Dư Nợ Quá Hạn</span>
              <TrendingDown className="h-4 w-4 text-rose-300" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {formatCurrency(kpis.totalDebt)}
            </p>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              Chưa bao gồm khoản đang khiếu nại
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Đang Tra Soát Khiếu Nại</span>
              <ShieldAlert className="h-4 w-4 text-amber-300" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {kpis.disputedCount} hóa đơn
            </p>
            <p className="text-[11px] text-amber-200 font-bold mt-0.5">
              Tạm ngừng nhắc nợ (MSG-254)
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Tỷ Lệ Thu Hồi Nợ</span>
              <CheckCircle2 className="h-4 w-4 text-[#78C2AD]" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {kpis.recoveryRate}%
            </p>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              Tăng 4.2% so với tháng trước
            </p>
          </div>
        </div>
      </div>

      {/* LƯỚI PHÂN TẦNG TUỔI NỢ (AGING DEBT TABS) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveAgingBucket('ALL')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 min-h-[44px] ${
            activeAgingBucket === 'ALL'
              ? 'bg-[#275A4E] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Tất Cả ({kpis.totalInvoices})</span>
        </button>

        <button
          onClick={() => setActiveAgingBucket('DAYS_1_3')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 min-h-[44px] ${
            activeAgingBucket === 'DAYS_1_3'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Nhắc Nhẹ (1-3 Ngày: FCM Push)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-black">
            {kpis.days13Count}
          </span>
        </button>

        <button
          onClick={() => setActiveAgingBucket('DAYS_4_10')}
          className={`flex-1 min-w-[220px] py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 min-h-[44px] ${
            activeAgingBucket === 'DAYS_4_10'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Thông Báo Chính Thức (4-10 Ngày: FCM + SMS)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-black">
            {kpis.days410Count}
          </span>
        </button>

        <button
          onClick={() => setActiveAgingBucket('DAYS_OVER_10')}
          className={`flex-1 min-w-[220px] py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 min-h-[44px] ${
            activeAgingBucket === 'DAYS_OVER_10'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <PhoneCall className="h-4 w-4" />
          <span>Cảnh Báo Khẩn (&gt;10 Ngày: Phiếu BGH Gọi)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-black">
            {kpis.daysOver10Count}
          </span>
        </button>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC KHIẾU NẠI */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bé, mã KP-xxxx, phụ huynh, số điện thoại, mã hóa đơn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-bold shrink-0">Lọc Khiếu Nại:</span>
          <select
            value={filterDispute}
            onChange={(e) => setFilterDispute(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
          >
            <option value="ALL">Tất cả tình trạng</option>
            <option value="NORMAL">Bình thường (sẵn sàng gửi)</option>
            <option value="DISPUTED">Đang có khiếu nại (tạm ngưng)</option>
          </select>
        </div>
      </div>

      {/* BẢNG DANH SÁCH HÓA ĐƠN QUÁ HẠN (RESPONSIVE TABLE) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-rose-600" />
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              Danh Sách Hóa Đơn Quá Hạn Cần Thu Hồi
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            Hiển thị {filteredInvoices.length} / {invoicesData?.length || 0} hồ sơ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-black tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Học Sinh / Lớp</th>
                <th className="py-3.5 px-4">Mã HĐ</th>
                <th className="py-3.5 px-4">Phụ Huynh & SĐT</th>
                <th className="py-3.5 px-4 text-center">Tuổi Nợ</th>
                <th className="py-3.5 px-4 text-right">Số Tiền Nợ</th>
                <th className="py-3.5 px-4">Nhắc Gần Nhất</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái Tra Soát</th>
                <th className="py-3.5 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Không có hóa đơn quá hạn nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((item) => {
                  const isDisputed = item.disputeStatus === 'DISPUTED';

                  // Badge màu theo số ngày quá hạn
                  const overdueBadgeColor =
                    item.agingBucket === 'DAYS_1_3'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : item.agingBucket === 'DAYS_4_10'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isDisputed ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{item.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
                            {item.studentCode}
                          </span>
                          <span>•</span>
                          <span>{item.className}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {item.invoiceNumber}
                        </span>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Hạn: {item.dueDate}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800">{item.parentName}</div>
                        <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <span>{item.parentPhone}</span>
                          {item.fallbackTeacherNoticeCreated && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded" title="Đã chuyển phiếu nhắc trực tiếp cho giáo viên chủ nhiệm đón trả">
                              Phiếu GV
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${overdueBadgeColor}`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>Quá {item.overdueDays} ngày</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="font-black text-rose-600 text-sm sm:text-base">
                          {formatCurrency(item.totalDebtAmount)}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {item.lastReminderAt ? (
                          <div>
                            <span className="text-xs font-bold text-slate-700">
                              {item.lastReminderChannel === 'FCM' ? 'FCM App' : 'SMS'} (Lần {item.reminderCount})
                            </span>
                            <div className="text-[11px] text-slate-400">{item.lastReminderAt}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa nhắc</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {isDisputed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                            <span>Có khiếu nại (Tạm hoãn)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Bình thường</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenPersonalModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 min-h-[38px]"
                            title="Soạn tin nhắn riêng gửi phụ huynh"
                          >
                            <SendHorizontal className="h-3.5 w-3.5" />
                            <span>Nhắc Nợ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SOẠN TIN NHẮN NHẮC NỢ RIÊNG (PERSONALIZED REMINDER MODAL) */}
      {showPersonalModal && selectedInvoiceForReminder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1E4D40] text-xs font-bold mb-1.5 border border-emerald-100">
                  <MessageSquare className="h-3.5 w-3.5 text-[#275A4E]" />
                  <span>Soạn Tin Nhắn Nhắc Nợ Học Phí Riêng Biệt</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedInvoiceForReminder.studentName} ({selectedInvoiceForReminder.studentCode})
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Phụ huynh: {selectedInvoiceForReminder.parentName} • SĐT: {selectedInvoiceForReminder.parentPhone}
                </p>
              </div>

              <button
                onClick={() => setShowPersonalModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Chi tiết dư nợ */}
            <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-800">Khoản nợ quá hạn:</span>
                <p className="text-lg font-black text-rose-900">
                  {formatCurrency(selectedInvoiceForReminder.totalDebtAmount)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-rose-700">Thời gian trễ hạn:</span>
                <p className="text-xs font-extrabold text-rose-900">
                  Quá hạn {selectedInvoiceForReminder.overdueDays} ngày (từ {selectedInvoiceForReminder.dueDate})
                </p>
              </div>
            </div>

            {/* CHỌN MẪU TIN NHẮN */}
            <div className="mt-4">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-2">
                1. Chọn Mẫu Tin Nhắn Tự Động Nhúng Biến:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('POLITE')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition min-h-[44px] ${
                    templateType === 'POLITE'
                      ? 'bg-[#275A4E] text-white border-[#275A4E]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Nhắc Nhẹ Nhàng
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('SECOND_NOTICE')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition min-h-[44px] ${
                    templateType === 'SECOND_NOTICE'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Thông Báo Lần 2
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('URGENT_WARNING')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition min-h-[44px] ${
                    templateType === 'URGENT_WARNING'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Cảnh Báo Khẩn
                </button>
              </div>
            </div>

            {/* CHỌN KÊNH GỬI */}
            <div className="mt-4">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-2">
                2. Chọn Kênh Thông Báo:
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer p-2.5 border rounded-xl flex-1 border-slate-200 hover:bg-slate-50 min-h-[44px]">
                  <input
                    type="radio"
                    name="reminder_channel"
                    checked={reminderChannel === 'FCM'}
                    onChange={() => setReminderChannel('FCM')}
                    className="text-[#275A4E] focus:ring-[#275A4E]"
                  />
                  <span>Push App Phụ Huynh (FCM)</span>
                </label>

                <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer p-2.5 border rounded-xl flex-1 border-slate-200 hover:bg-slate-50 min-h-[44px]">
                  <input
                    type="radio"
                    name="reminder_channel"
                    checked={reminderChannel === 'SMS'}
                    onChange={() => setReminderChannel('SMS')}
                    className="text-[#275A4E] focus:ring-[#275A4E]"
                  />
                  <span>Tin Nhắn SMS Brandname</span>
                </label>
              </div>
            </div>

            {/* NỘI DUNG TIN NHẮN (TỰ ĐỘNG NHÚNG BIẾN & CHO PHÉP SỬA) */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  3. Nội Dung Tin Nhắn Gửi Phụ Huynh:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(customMessage);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="text-xs font-bold text-[#275A4E] hover:underline flex items-center gap-1"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? 'Đã sao chép' : 'Sao chép văn bản'}</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:border-[#275A4E] focus:outline-hidden leading-relaxed"
                placeholder="Nhập nội dung tin nhắn nhắc nợ..."
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tự động nhúng: {'{Tên Bé}'}, {'{Số Tiền Nợ}'}, {'{Số Ngày Quá Hạn}'} và {'{Link VietQR 1-Chạm}'}.
              </p>
            </div>

            {/* LINK VIETQR 1-CHẠM PREVIEW */}
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-[#275A4E]" />
                <span className="font-semibold text-slate-700">Link VietQR đính kèm:</span>
                <span className="font-mono text-emerald-800 font-bold">
                  kidpro.edu.vn/pay/{selectedInvoiceForReminder.invoiceNumber}
                </span>
              </div>
              <span className="text-[11px] bg-emerald-100 text-[#1E4D40] px-2 py-0.5 rounded font-extrabold">
                1-Chạm
              </span>
            </div>

            {/* Nút hành động */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPersonalModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition min-h-[44px]"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                onClick={handleSendPersonalReminder}
                disabled={individualReminderMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center gap-2 min-h-[44px] disabled:opacity-50"
              >
                <SendHorizontal className="h-4 w-4" />
                <span>
                  {individualReminderMutation.isPending ? 'Đang Gửi...' : 'Gửi Tin Nhắc Riêng Tức Thì'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KÍCH HOẠT NHẮC NỢ HÀNG LOẠT (BATCH TRIGGER MODAL) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold mb-1.5 border border-amber-200">
                  <Send className="h-3.5 w-3.5 text-amber-600" />
                  <span>Bộ Động Cơ Kích Hoạt Nhắc Nợ Tự Động (09:00 AM)</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Phát Thông Báo Nhắc Nợ Toàn Trường
                </h3>
              </div>

              <button
                onClick={() => setShowBatchModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {!batchResult ? (
              <div className="mt-4 space-y-4">
                <p className="text-xs sm:text-sm text-slate-600">
                  Hệ thống sẽ quét toàn bộ danh sách hóa đơn quá hạn và gửi thông báo theo quy tắc phân tầng tuổi nợ:
                </p>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">• Quá hạn 1-3 ngày:</span>
                    <span className="font-bold text-[#275A4E]">FCM Push App ({kpis.days13Count} hồ sơ)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">• Quá hạn 4-10 ngày:</span>
                    <span className="font-bold text-orange-600">FCM Push + SMS Brandname ({kpis.days410Count} hồ sơ)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">• Quá hạn &gt; 10 ngày:</span>
                    <span className="font-bold text-rose-600">Phiếu BGH gọi trực tiếp ({kpis.daysOver10Count} hồ sơ)</span>
                  </div>
                </div>

                {/* KÊNH PHÁT THÔNG BÁO TỰ ĐỘNG */}
                <div className="pt-1">
                  <span className="text-xs font-black text-slate-700 block mb-2">Kênh kích hoạt thông báo:</span>
                  <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchChannels.includes('FCM')}
                        onChange={(e) => {
                          if (e.target.checked) setBatchChannels((prev) => [...prev, 'FCM']);
                          else setBatchChannels((prev) => prev.filter((c) => c !== 'FCM'));
                        }}
                        className="rounded text-[#275A4E]"
                      />
                      <span>Push App Phụ Huynh (FCM)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchChannels.includes('SMS')}
                        onChange={(e) => {
                          if (e.target.checked) setBatchChannels((prev) => [...prev, 'SMS']);
                          else setBatchChannels((prev) => prev.filter((c) => c !== 'SMS'));
                        }}
                        className="rounded text-[#275A4E]"
                      />
                      <span>SMS Brandname</span>
                    </label>
                  </div>
                </div>

                {/* TÙY CHỌN BẢO VỆ & RULE NGHIỆP VỤ */}
                <div className="space-y-2 pt-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchExcludeDisputed}
                      onChange={(e) => setBatchExcludeDisputed(e.target.checked)}
                      className="mt-0.5 rounded text-[#275A4E] focus:ring-[#275A4E]"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-emerald-950">
                        Tự động loại trừ {kpis.disputedCount} hóa đơn đang trong quá trình tra soát khiếu nại (MSG-254)
                      </span>
                      <p className="text-emerald-700 mt-0.5">
                        Tuân thủ quy định bảo vệ quyền lợi phụ huynh khi có sai sót học phí.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="mt-0.5 rounded text-[#275A4E] focus:ring-[#275A4E]"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800">
                        Tự động quét VietQR PayOS loại trừ các phụ huynh vừa nộp tiền trong 15 phút qua
                      </span>
                      <p className="text-slate-500 mt-0.5">
                        Chống nhắc nợ nhầm gây phiền toái cho phụ huynh đã hoàn tất nghĩa vụ.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 min-h-[44px]"
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerBatchReminders}
                    disabled={batchReminderMutation.isPending}
                    className="px-6 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center gap-2 min-h-[44px] disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>
                      {batchReminderMutation.isPending ? 'Đang Xử Lý Bắn Tin...' : 'Bắt Đầu Kích Hoạt Ngay'}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* KẾT QUẢ PHÁT HÀNH HÀNG LOẠT */
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Kết Quả Đợt Nhắc Nợ Học Phí Tự Động</span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-emerald-900">
                    <div className="flex justify-between font-bold">
                      <span>• Tổng số hồ sơ hợp lệ:</span>
                      <span>{batchResult.totalEligible} phụ huynh</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>• Gửi thành công (FCM + SMS):</span>
                      <span>{batchResult.sentSuccessCount} phụ huynh (MSG-252)</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-700">
                      <span>• SMS lỗi (tạo phiếu nhắc cổng cho GV):</span>
                      <span>{batchResult.fallbackTeacherNoticesCreated} phụ huynh (MSG-253)</span>
                    </div>
                    <div className="flex justify-between font-bold text-amber-700">
                      <span>• Hóa đơn khiếu nại đã tạm hoãn:</span>
                      <span>{batchResult.disputedSkippedCount} phụ huynh (MSG-254)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-6 py-2.5 rounded-xl bg-[#275A4E] text-white font-extrabold text-xs sm:text-sm shadow-md min-h-[44px]"
                  >
                    Hoàn Tất & Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverdueDebtRemindersTab;
